package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.domain.entities.Order;
import com.devtiro.tickets.domain.entities.Ticket;
import com.devtiro.tickets.domain.entities.User;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public interface NotificationService {

  void sendStaffInviteEmail(String toEmail, Event event, String tempPassword);

  void sendStaffAddedEmail(String toEmail, Event event);

  void sendEventCancellationEmail(String toEmail, Event event);

  // Ph3: sends the paid attendee their tickets + QR codes as email attachments.
  void sendOrderConfirmationEmail(
          User purchaser,
          Order order,
          List<Ticket> tickets,
          Map<UUID, byte[]> qrCodeImagesByTicketId
  );
}