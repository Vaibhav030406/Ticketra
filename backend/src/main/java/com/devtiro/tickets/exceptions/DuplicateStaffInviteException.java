package com.devtiro.tickets.exceptions;

public class DuplicateStaffInviteException extends EventTicketException {

  public DuplicateStaffInviteException() {
  }

  public DuplicateStaffInviteException(String message) {
    super(message);
  }

  public DuplicateStaffInviteException(String message, Throwable cause) {
    super(message, cause);
  }

  public DuplicateStaffInviteException(Throwable cause) {
    super(cause);
  }

  public DuplicateStaffInviteException(String message, Throwable cause,
      boolean enableSuppression, boolean writableStackTrace) {
    super(message, cause, enableSuppression, writableStackTrace);
  }
}
