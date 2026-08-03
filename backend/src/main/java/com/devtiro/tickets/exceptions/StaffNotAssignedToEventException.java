package com.devtiro.tickets.exceptions;

public class StaffNotAssignedToEventException extends EventTicketException {

  public StaffNotAssignedToEventException() {
    super("Staff member is not assigned to this event");
  }

  public StaffNotAssignedToEventException(String message) {
    super(message);
  }
}
