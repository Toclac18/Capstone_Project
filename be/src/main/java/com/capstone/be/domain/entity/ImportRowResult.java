package com.capstone.be.domain.entity;

public class ImportRowResult {
  private int row;
  private String fullName;
  private String username;
  private String email;
  private boolean imported;
  private boolean emailSent;
  private String error; // nullable

  public int getRow() {
    return row;
  }

  public void setRow(int row) {
    this.row = row;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public boolean isImported() {
    return imported;
  }

  public void setImported(boolean imported) {
    this.imported = imported;
  }

  public boolean isEmailSent() {
    return emailSent;
  }

  public void setEmailSent(boolean emailSent) {
    this.emailSent = emailSent;
  }

  public String getError() {
    return error;
  }

  public void setError(String error) {
    this.error = error;
  }
}
