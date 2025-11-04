package com.capstone.be.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

public final class TicketCode {
  private TicketCode() {}

  public static String generate() {
    String date = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE); // 20251029
    String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tránh 0,O,1,I
    ThreadLocalRandom r = ThreadLocalRandom.current();
    StringBuilder suffix = new StringBuilder(5);
    for (int i = 0; i < 5; i++) suffix.append(alphabet.charAt(r.nextInt(alphabet.length())));
    return "TCK-" + date + "-" + suffix;
  }
}
