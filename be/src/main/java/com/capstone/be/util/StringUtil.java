package com.capstone.be.util;

public class StringUtil {

  public static String normalize(String s) {
    return s.toLowerCase().replaceAll("[^a-z0-9]]", "");
  }

}
