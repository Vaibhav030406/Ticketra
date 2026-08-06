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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

// The actual source of truth for "who can scan tickets for which event".
// Keycloak's STAFF realm role is only a coarse capability gate (checked in
// SecurityConfig); this table is what scopes that capability down to a
// specific event, and is what TicketValidationServiceImpl checks against.
@Entity
@Table(
    name = "event_staff",
    uniqueConstraints = @UniqueConstraint(columnNames = {"event_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventStaff {

  @Id
  @Column(name = "id", nullable = false, updatable = false)
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "event_id", nullable = false)
  private Event event;

  // Nullable: an invite can exist before the invitee has a User row at all
  // (they haven't signed up yet). Populated once they accept.
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  // The email the invite was sent to — kept independent of `user` so an
  // invite is identifiable/resendable even before a matching User exists.
  @Column(name = "invited_email", nullable = false)
  private String invitedEmail;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "invited_by_id", nullable = false)
  private User invitedBy;

  @Column(name = "status", nullable = false)
  @Enumerated(EnumType.STRING)
  private EventStaffStatusEnum status;

  @CreatedDate
  @Column(name = "created_at", updatable = false, nullable = false)
  private LocalDateTime createdAt;

  @LastModifiedDate
  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;
}
