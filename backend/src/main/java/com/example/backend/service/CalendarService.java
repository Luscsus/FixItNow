package com.example.backend.service;

import com.example.backend.common.exception.ApiException;
import com.example.backend.domain.calendar.ProviderTimeBlock;
import com.example.backend.domain.calendar.TimeBlockType;
import com.example.backend.domain.ticket.Ticket;
import com.example.backend.domain.ticket.TicketStatus;
import com.example.backend.domain.user.Provider;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.ProviderRepository;
import com.example.backend.repository.ProviderTimeBlockRepository;
import com.example.backend.web.dto.request.TimeBlockCreateRequest;
import com.example.backend.web.dto.request.TimeBlockUpdateRequest;
import com.example.backend.web.dto.response.PublicTimeBlockResponse;
import com.example.backend.web.dto.response.TimeBlockResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CalendarService {

    private static final long MAX_RANGE_DAYS = 90;
    private static final long MAX_BLOCK_DAYS = 7;

    private final ProviderTimeBlockRepository blockRepository;
    private final ProviderRepository providerRepository;

    public CalendarService(ProviderTimeBlockRepository blockRepository,
                           ProviderRepository providerRepository) {
        this.blockRepository = blockRepository;
        this.providerRepository = providerRepository;
    }

    @Transactional(readOnly = true)
    public List<TimeBlockResponse> listOwn(UUID providerId, LocalDateTime from, LocalDateTime to) {
        validateRange(from, to);
        List<ProviderTimeBlock> blocks = blockRepository.findInRange(providerId, from, to);
        return subtractBookedFromAvailable(blocks).stream()
            .map(TimeBlockResponse::from)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<PublicTimeBlockResponse> listPublic(UUID providerId, LocalDateTime from, LocalDateTime to) {
        validateRange(from, to);
        if (!providerRepository.existsById(providerId)) {
            throw new UserNotFoundException("Provider not found: " + providerId);
        }
        List<ProviderTimeBlock> blocks = blockRepository.findInRange(providerId, from, to);
        return subtractBookedFromAvailable(blocks).stream()
            .map(PublicTimeBlockResponse::from)
            .toList();
    }

    /**
     * Splits each AVAILABLE block by all BOOKED blocks so customers see the actual remaining
     * availability. For example, AVAILABLE 8:00-11:00 with a BOOKED 8:00-10:00 becomes a single
     * AVAILABLE 10:00-11:00. Non-AVAILABLE blocks (BOOKED, BREAK, OFF) pass through unchanged.
     */
    private List<ProviderTimeBlock> subtractBookedFromAvailable(List<ProviderTimeBlock> blocks) {
        List<ProviderTimeBlock> booked = blocks.stream()
            .filter(b -> b.getType() == TimeBlockType.BOOKED)
            .toList();
        List<ProviderTimeBlock> result = new ArrayList<>();
        for (ProviderTimeBlock b : blocks) {
            if (b.getType() != TimeBlockType.AVAILABLE) {
                result.add(b);
                continue;
            }
            List<LocalDateTime[]> segments = new ArrayList<>();
            segments.add(new LocalDateTime[]{ b.getStartAt(), b.getEndAt() });
            for (ProviderTimeBlock bk : booked) {
                List<LocalDateTime[]> next = new ArrayList<>();
                for (LocalDateTime[] seg : segments) {
                    LocalDateTime s = seg[0], e = seg[1];
                    LocalDateTime bs = bk.getStartAt(), be = bk.getEndAt();
                    boolean overlaps = s.isBefore(be) && e.isAfter(bs);
                    if (!overlaps) {
                        next.add(seg);
                        continue;
                    }
                    if (s.isBefore(bs)) next.add(new LocalDateTime[]{ s, bs });
                    if (e.isAfter(be)) next.add(new LocalDateTime[]{ be, e });
                }
                segments = next;
            }
            for (LocalDateTime[] seg : segments) {
                result.add(ProviderTimeBlock.builder()
                    .provider(b.getProvider())
                    .startAt(seg[0])
                    .endAt(seg[1])
                    .type(TimeBlockType.AVAILABLE)
                    .title(b.getTitle())
                    .notes(b.getNotes())
                    .build());
            }
        }
        return result;
    }

    /**
     * Throws if the requested window is not fully inside one of the provider's AVAILABLE blocks
     * or if it overlaps an existing BOOKED block. Excludes a specific ticket's own BOOKED block
     * from the conflict check (used when re-validating after creation).
     */
    @Transactional(readOnly = true)
    public void validateRequestedSlot(UUID providerId, LocalDateTime start, LocalDateTime end, Long excludeTicketId) {
        if (start == null || end == null || !end.isAfter(start)) {
            throw new ApiException("Requested time window is invalid.");
        }
        List<ProviderTimeBlock> blocks = blockRepository.findInRange(providerId, start, end);
        boolean insideAvailable = blocks.stream()
            .filter(b -> b.getType() == TimeBlockType.AVAILABLE)
            .anyMatch(b -> !start.isBefore(b.getStartAt()) && !end.isAfter(b.getEndAt()));
        if (!insideAvailable) {
            throw new ApiException("Requested time is not within any of the provider's available slots.");
        }
        if (blockRepository.existsBookedOverlap(providerId, start, end, excludeTicketId)) {
            throw new ApiException("This time slot is already taken.");
        }
    }

    @Transactional
    public TimeBlockResponse create(UUID providerId, TimeBlockCreateRequest req) {
        if (req.getType() == TimeBlockType.BOOKED) {
            throw new ApiException("BOOKED blocks are system-managed and cannot be created manually.");
        }
        validateBlockBounds(req.getStartAt(), req.getEndAt());

        Provider provider = providerRepository.findById(providerId)
            .orElseThrow(() -> new UserNotFoundException("Provider not found: " + providerId));

        if (blockRepository.existsOverlap(providerId, req.getStartAt(), req.getEndAt(), null)) {
            throw new ApiException("Time block overlaps an existing block in your calendar.");
        }

        ProviderTimeBlock block = ProviderTimeBlock.builder()
            .provider(provider)
            .startAt(req.getStartAt())
            .endAt(req.getEndAt())
            .type(req.getType())
            .title(req.getTitle())
            .notes(req.getNotes())
            .build();

        return TimeBlockResponse.from(blockRepository.save(block));
    }

    @Transactional
    public TimeBlockResponse update(UUID providerId, UUID blockId, TimeBlockUpdateRequest req) {
        ProviderTimeBlock block = blockRepository.findById(blockId)
            .orElseThrow(() -> new ApiException("Time block not found: " + blockId));

        if (!block.getProvider().getId().equals(providerId)) {
            throw new AccessDeniedException("You cannot edit another provider's calendar.");
        }
        if (block.getType() == TimeBlockType.BOOKED) {
            throw new ApiException("BOOKED blocks are linked to tickets and cannot be edited directly.");
        }

        LocalDateTime newStart = req.getStartAt() != null ? req.getStartAt() : block.getStartAt();
        LocalDateTime newEnd   = req.getEndAt()   != null ? req.getEndAt()   : block.getEndAt();
        TimeBlockType newType  = req.getType()    != null ? req.getType()    : block.getType();

        if (newType == TimeBlockType.BOOKED) {
            throw new ApiException("Cannot change a block to BOOKED manually.");
        }
        validateBlockBounds(newStart, newEnd);

        if (blockRepository.existsOverlap(providerId, newStart, newEnd, blockId)) {
            throw new ApiException("Time block overlaps an existing block in your calendar.");
        }

        block.setStartAt(newStart);
        block.setEndAt(newEnd);
        block.setType(newType);
        if (req.getTitle() != null) block.setTitle(req.getTitle());
        if (req.getNotes() != null) block.setNotes(req.getNotes());

        return TimeBlockResponse.from(blockRepository.save(block));
    }

    @Transactional
    public void delete(UUID providerId, UUID blockId) {
        ProviderTimeBlock block = blockRepository.findById(blockId)
            .orElseThrow(() -> new ApiException("Time block not found: " + blockId));

        if (!block.getProvider().getId().equals(providerId)) {
            throw new AccessDeniedException("You cannot edit another provider's calendar.");
        }
        if (block.getType() == TimeBlockType.BOOKED) {
            throw new ApiException("BOOKED blocks are removed automatically when their ticket is closed.");
        }
        blockRepository.delete(block);
    }

    /**
     * Upsert a BOOKED time block to match the ticket's current scheduled window and assignee.
     * Removes the block if the ticket has no schedule, no provider, or is in a closed state.
     */
    @Transactional
    public void syncBookedBlockForTicket(Ticket ticket) {
        Optional<ProviderTimeBlock> existing = blockRepository.findByTicket_Id(ticket.getId());

        boolean closed = ticket.getStatus() == TicketStatus.COMPLETED
            || ticket.getStatus() == TicketStatus.CANCELLED
            || ticket.getStatus() == TicketStatus.DECLINED;

        LocalDateTime startAt = ticket.getScheduledStartAt() != null
            ? ticket.getScheduledStartAt() : ticket.getRequestedStartAt();
        LocalDateTime endAt = ticket.getScheduledEndAt() != null
            ? ticket.getScheduledEndAt() : ticket.getRequestedEndAt();
        boolean hasSchedule = startAt != null && endAt != null && endAt.isAfter(startAt);

        UUID assignedId = ticket.getAssignedServiceProvider() != null
            ? ticket.getAssignedServiceProvider().getId() : null;
        Optional<Provider> providerOpt = assignedId != null
            ? providerRepository.findById(assignedId) : Optional.empty();

        if (closed || !hasSchedule || providerOpt.isEmpty()) {
            existing.ifPresent(blockRepository::delete);
            return;
        }

        Provider provider = providerOpt.get();

        boolean isNew = existing.isEmpty();
        if (isNew && blockRepository.existsBookedOverlap(provider.getId(),
                startAt, endAt, ticket.getId())) {
            throw new ApiException("This time slot is already booked for another job.");
        }

        ProviderTimeBlock block = existing.orElseGet(() -> ProviderTimeBlock.builder()
            .type(TimeBlockType.BOOKED)
            .ticket(ticket)
            .build());

        block.setProvider(provider);
        block.setStartAt(startAt);
        block.setEndAt(endAt);
        block.setType(TimeBlockType.BOOKED);
        block.setTicket(ticket);
        String title = ticket.getServiceType() != null ? ticket.getServiceType() : "Booked job";
        block.setTitle(title);

        blockRepository.save(block);
    }

    private void validateRange(LocalDateTime from, LocalDateTime to) {
        if (from == null || to == null) {
            throw new ApiException("Both 'from' and 'to' are required.");
        }
        if (!to.isAfter(from)) {
            throw new ApiException("'to' must be after 'from'.");
        }
        if (Duration.between(from, to).toDays() > MAX_RANGE_DAYS) {
            throw new ApiException("Query range cannot exceed " + MAX_RANGE_DAYS + " days.");
        }
    }

    private void validateBlockBounds(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) {
            throw new ApiException("Block must have both start and end.");
        }
        if (!end.isAfter(start)) {
            throw new ApiException("Block end must be after start.");
        }
        if (Duration.between(start, end).toDays() > MAX_BLOCK_DAYS) {
            throw new ApiException("A single block cannot span more than " + MAX_BLOCK_DAYS + " days.");
        }
    }
}
