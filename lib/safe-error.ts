const sensitivePatterns = [
  /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /postgres(?:ql)?:\/\/[^\s"'<>]+/gi,
  /mysql:\/\/[^\s"'<>]+/gi,
  /mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi,
  /(authorization|cookie|set-cookie|access[_-]?token|page[_-]?access[_-]?token|refresh[_-]?token|session|password|secret|database[_-]?url|direct[_-]?url)\s*[:=]\s*["']?[^"',}\]\s]+/gi,
  /EA[A-Za-z0-9]{20,}/g,
];

export function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return sanitizeText(error.message) || "Unexpected server error.";
  }

  if (typeof error === "string") {
    return sanitizeText(error) || "Unexpected server error.";
  }

  return "Unexpected server error.";
}

export function getSafeProviderErrorMessage(error: unknown) {
  const message = getSafeErrorMessage(error);
  return message === "Unexpected server error." ? "Provider request failed." : message;
}

export function sanitizeLogMetadata(metadata: unknown) {
  return sanitizeValue(metadata);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    return sanitizeText(value);
  }

  if (value instanceof Error) {
    return {
      name: sanitizeText(value.name),
      message: sanitizeText(value.message),
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    const safe: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        safe[key] = "[REDACTED]";
        continue;
      }

      safe[key] = sanitizeValue(item);
    }

    return safe;
  }

  return value;
}

function sanitizeText(value: string) {
  return sensitivePatterns.reduce((text, pattern) => text.replace(pattern, "[REDACTED]"), value).slice(0, 500);
}

function isSensitiveKey(key: string) {
  return /authorization|cookie|token|secret|password|session|databaseurl|database_url|directurl|direct_url/i.test(key);
}
