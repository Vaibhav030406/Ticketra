package com.devtiro.tickets.domain.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

  @Id
  @Column(name = "id", nullable = false, updatable = false)
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "purchaser_id", nullable = false)
  private User purchaser;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ticket_type_id", nullable = false)
  private TicketType ticketType;

  @Column(name = "quantity", nullable = false)
  private Integer quantity;

  // Snapshot of TicketType.price at the moment the order was created, so a
  // later price change on the TicketType never retroactively changes what a
  // past order is recorded as having cost.
  @Column(name = "unit_price", nullable = false)
  private Double unitPrice;

  // Stored rather than computed (unitPrice * quantity) so the audit trail is
  // fixed even if unitPrice/quantity fields are ever inspected independently.
  @Column(name = "total_amount", nullable = false)
  private Double totalAmount;

  @Column(name = "status", nullable = false)
  @Enumerated(EnumType.STRING)
  private OrderStatusEnum status;

  // Set as soon as the order is created and Razorpay's order is opened.
  @Column(name = "razorpay_order_id")
  private String razorpayOrderId;

  // Set only once the webhook confirms a successful capture.
  @Column(name = "razorpay_payment_id")
  private String razorpayPaymentId;

  // Client-generated, unique. Lets a retried "buy" request be recognised as
  // the same attempt instead of creating a second order and double-holding
  // stock.
  @Column(name = "idempotency_key", nullable = false, unique = true)
  private String idempotencyKey;

  // Stock is held from the moment this order is created (PENDING). If the
  // order is still PENDING after this timestamp, a cleanup job releases the
  // held stock and marks the order EXPIRED.
  @Column(name = "expires_at", nullable = false)
  private LocalDateTime expiresAt;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
  @Builder.Default
  private List<Ticket> tickets = new ArrayList<>();

  @CreatedDate
  @Column(name = "created_at", updatable = false, nullable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  @Override
  public boolean equals(Object o) {
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    Order order = (Order) o;
    return Objects.equals(id, order.id) && Objects.equals(quantity, order.quantity)
        && Objects.equals(unitPrice, order.unitPrice) && Objects.equals(totalAmount,
        order.totalAmount) && status == order.status && Objects.equals(razorpayOrderId,
        order.razorpayOrderId) && Objects.equals(razorpayPaymentId, order.razorpayPaymentId)
        && Objects.equals(idempotencyKey, order.idempotencyKey) && Objects.equals(expiresAt,
        order.expiresAt) && Objects.equals(createdAt, order.createdAt) && Objects.equals(
        updatedAt, order.updatedAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, quantity, unitPrice, totalAmount, status, razorpayOrderId,
        razorpayPaymentId, idempotencyKey, expiresAt, createdAt, updatedAt);
  }
}
