package com.devtiro.tickets.domain.entities;

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
import jakarta.persistence.Table;
import java.time.LocalDateTime;
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
@Table(name = "ticket_validations")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TicketValidation {

  @Id
  @Column(name = "id", nullable = false, updatable = false)
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(name = "status", nullable = false)
  @Enumerated(EnumType.STRING)
  private TicketValidationStatusEnum status;

  @Column(name = "validation_method", nullable = false)
  @Enumerated(EnumType.STRING)
  private TicketValidationMethod validationMethod;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ticket_id")
  private Ticket ticket;

  // The staff member who performed this scan/validation. Taken from the
  // authenticated JWT, never from the request body — staff must not be able
  // to claim to be someone else.
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "validated_by_id")
  private User validatedBy;

  // Not persisted — populated in-memory only when this validation is a
  // duplicate, so the mapper can build a response describing the original
  // valid scan without a second query. See TicketValidationServiceImpl.
  @jakarta.persistence.Transient
  private TicketValidation originalValidationContext;

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
    TicketValidation that = (TicketValidation) o;
    return Objects.equals(id, that.id) && status == that.status && Objects.equals(createdAt,
        that.createdAt) && Objects.equals(updatedAt, that.updatedAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, status, createdAt, updatedAt);
  }
}
