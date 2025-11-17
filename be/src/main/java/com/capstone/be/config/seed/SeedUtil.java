package com.capstone.be.config.seed;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

public class SeedUtil {

  /**
   * create fixed UUID to test
   */
  public static UUID generateUUID(int seed) {
    return UUID.nameUUIDFromBytes(("seed-" + seed).getBytes(StandardCharsets.UTF_8));
  }

  public static UUID generateUUID(String seed) {
    return UUID.nameUUIDFromBytes(seed.getBytes(StandardCharsets.UTF_8));
  }


}
