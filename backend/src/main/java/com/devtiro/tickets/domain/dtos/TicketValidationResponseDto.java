package com.devtiro.tickets.domain.dtos;

import com.devtiro.tickets.domain.entities.TicketValidationStatusEnum;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketValidationResponseDto {

  private UUID ticketId;
  private TicketValidationStatusEnum status;

  // Populated only when status is INVALID due to a duplicate scan — tells
  // staff exactly when/by whom the ticket was already checked in, rather
  // than just a bare rejection.
  private LocalDateTime originalValidationAt;
  private String originalValidatedByName;
}
