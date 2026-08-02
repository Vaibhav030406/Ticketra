package com.devtiro.tickets.exceptions;
 
public class InvalidWebhookSignatureException extends EventTicketException {
 
  public InvalidWebhookSignatureException() {
  }
 
  public InvalidWebhookSignatureException(String message) {
    super(message);
  }
 
  public InvalidWebhookSignatureException(String message, Throwable cause) {
    super(message, cause);
  }
 
  public InvalidWebhookSignatureException(Throwable cause) {
    super(cause);
  }
 
  public InvalidWebhookSignatureException(String message, Throwable cause,
      boolean enableSuppression, boolean writableStackTrace) {
    super(message, cause, enableSuppression, writableStackTrace);
  }
}
