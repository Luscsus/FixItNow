import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { issueInvoice } from '@/services/ticketService';
import { generateInvoicePdf } from '@/utils/generateInvoicePdf';
import type { Ticket } from '@/domain/ticket';

interface Props {
  ticket: Ticket;
}

export function IssueInvoicePanel({ ticket }: Props) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) throw new Error('Please enter a valid amount.');

      const ticketCode = `FIX-${String(ticket.id).padStart(4, '0')}`;
      const pdfBlob = await generateInvoicePdf({
        ticketCode,
        serviceType: ticket.serviceType,
        category: ticket.category,
        description: ticket.description,
        location: ticket.location ?? '',
        providerName: ticket.assignedServiceProviderName ?? 'Provider',
        customerName: ticket.submittedByName ?? 'Customer',
        amount: parsed,
        issuedAt: new Date(),
      });

      return issueInvoice(ticket.id, parsed, pdfBlob, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', ticket.id] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  const handlePreview = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError('Enter a valid amount first.'); return; }
    setError(null);
    const ticketCode = `FIX-${String(ticket.id).padStart(4, '0')}`;
    const blob = await generateInvoicePdf({
      ticketCode,
      serviceType: ticket.serviceType,
      category: ticket.category,
      description: ticket.description,
      location: ticket.location ?? '',
      providerName: ticket.assignedServiceProviderName ?? 'Provider',
      customerName: ticket.submittedByName ?? 'Customer',
      amount: parsed,
      issuedAt: new Date(),
    });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '24px 24px 20px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 6,
          }}
        >
          Issue Invoice
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Enter the total amount. A PDF invoice will be generated and emailed to{' '}
          <strong style={{ color: 'var(--text)' }}>
            {ticket.submittedByName ?? 'the customer'}
          </strong>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              position: 'relative',
              flex: 1,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              $
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => { setAmount(e.target.value); setError(null); }}
              disabled={mutation.isPending}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px 10px 26px',
                fontSize: 16,
                fontWeight: 600,
                border: '1px solid var(--border)',
                borderRadius: 10,
                background: 'var(--slate-50, #f8fafc)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePreview}
            disabled={mutation.isPending}
            title="Preview the PDF before sending"
          >
            Preview
          </button>
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: '#B91C1C',
              background: '#FEE2E2',
              padding: '6px 10px',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            {error}
          </div>
        )}

        {mutation.isSuccess && (
          <div
            style={{
              fontSize: 12,
              color: '#166534',
              background: '#DCFCE7',
              padding: '6px 10px',
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            ✓ Invoice sent — ticket moved to Pending Payment.
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={mutation.isPending || !amount}
          style={{ width: '100%' }}
        >
          {mutation.isPending ? 'Generating & sending…' : 'Send Invoice →'}
        </button>
      </form>
    </div>
  );
}
