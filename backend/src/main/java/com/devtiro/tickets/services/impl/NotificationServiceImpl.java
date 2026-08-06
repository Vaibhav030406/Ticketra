package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.entities.Event;
import com.devtiro.tickets.exceptions.EmailSendException;
import com.devtiro.tickets.services.NotificationService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

  private final JavaMailSender mailSender;

  @Value("${mail.from}")
  private String fromAddress;

  @Value("${app.frontend-url}")
  private String frontendUrl;

  @Override
  public void sendStaffInviteEmail(String toEmail, Event event, String tempPassword) {
    String subject = String.format("You've been added as staff for %s", event.getName());
    String body = String.format(
        "<p>You've been added as a staff member for <strong>%s</strong>, "
            + "responsible for scanning and validating tickets at the door.</p>"
            + "<p>An account has been created for you:</p>"
            + "<p>Email: %s<br/>Temporary password: <strong>%s</strong></p>"
            + "<p>You'll be asked to set a new password the first time you log in.</p>"
            + "<p><a href=\"%s\">Log in here</a></p>",
        event.getName(), toEmail, tempPassword, frontendUrl
    );
    send(toEmail, subject, body);
  }

  @Override
  public void sendStaffAddedEmail(String toEmail, Event event) {
    String subject = String.format("You've been added as staff for %s", event.getName());
    String body = String.format(
        "<p>You've been added as a staff member for <strong>%s</strong>, "
            + "responsible for scanning and validating tickets at the door.</p>"
            + "<p>Log in with your existing account to get started.</p>"
            + "<p><a href=\"%s\">Log in here</a></p>",
        event.getName(), frontendUrl
    );
    send(toEmail, subject, body);
  }

  /**
   * Ph2 stub — logs intent only.
   * Ph3 will replace this with a real HTML email informing the attendee of the
   * cancellation and their refund details.
   */
  @Override
  public void sendEventCancellationEmail(String toEmail, Event event) {
    log.info(
        "STUB [Ph2]: Would send event cancellation email to '{}' for event '{}' (id={}). Wire up in Ph3.",
        toEmail, event.getName(), event.getId()
    );
  }

  private void send(String toEmail, String subject, String htmlBody) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true);
      helper.setFrom(fromAddress);
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setText(htmlBody, true);
      mailSender.send(message);
    } catch (Exception e) {
      // Deliberately not rethrown as a hard failure by callers of this
      // service — see EventStaffServiceImpl, where a failed invite email
      // must not undo an already-created account/role assignment.
      log.warn("Failed to send email to {}: {}", toEmail, e.getMessage());
    }
  }
}
