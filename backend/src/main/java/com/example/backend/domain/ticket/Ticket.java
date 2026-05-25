package com.example.backend.domain.ticket;

import com.example.backend.domain.location.Location;
import com.example.backend.domain.user.ServiceCategory;
import com.example.backend.domain.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tickets")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "service_type", nullable = false, length = 255)
    private String serviceType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ServiceCategory category = ServiceCategory.OTHER;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TicketStatus status = TicketStatus.PENDING_APPROVAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TicketPriority priority = TicketPriority.MEDIUM;

    @Column(name = "estimated_cost", precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_service_provider_id")
    private User assignedServiceProvider;

    @Column(name = "chat_room_id")
    private UUID chatRoomId;

    @Column(name = "scheduled_start_at")
    private LocalDateTime scheduledStartAt;

    @Column(name = "scheduled_end_at")
    private LocalDateTime scheduledEndAt;

    @Column(name = "requested_start_at")
    private LocalDateTime requestedStartAt;

    @Column(name = "requested_end_at")
    private LocalDateTime requestedEndAt;

    public Ticket() {
    }

    public Ticket(Long id, User user, Location location, String serviceType, ServiceCategory category,
                  String description, TicketStatus status, TicketPriority priority, BigDecimal estimatedCost,
                  LocalDateTime createdAt, LocalDateTime updatedAt, User assignedServiceProvider) {
        this.id = id;
        this.user = user;
        this.location = location;
        this.serviceType = serviceType;
        this.category = category;
        this.description = description;
        this.status = status;
        this.priority = priority;
        this.estimatedCost = estimatedCost;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.assignedServiceProvider = assignedServiceProvider;
    }

}
