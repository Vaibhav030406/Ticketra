package com.devtiro.tickets.exceptions;

public class UserNotFoundException extends EventTicketException {

  public UserNotFoundException() {
    super("User not found");
  }

  public UserNotFoundException(String message) {
    super(message);
  }
}
