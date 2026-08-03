package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.entities.TicketValidation;
import java.util.UUID;

public interface TicketValidationService {
  TicketValidation validateTicketByQrCode(UUID staffUserId, UUID qrCodeId);
  TicketValidation validateTicketManually(UUID staffUserId, UUID ticketId);
}
