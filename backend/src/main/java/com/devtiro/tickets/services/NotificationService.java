package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.entities.Event;

public interface NotificationService {

  void sendStaffInviteEmail(String toEmail, Event event, String tempPassword);

  void sendStaffAddedEmail(String toEmail, Event event);

  // Ph2 stub — logs intent only. Ph3 wires up real email delivery.
  void sendEventCancellationEmail(String toEmail, Event event);
}
