package com.devtiro.tickets.exceptions;

public class NotEventStaffException extends EventTicketException {

  public NotEventStaffException() {
    super("You are not authorized to validate tickets for this event");
  }

  public NotEventStaffException(String message) {
    super(message);
  }
}
