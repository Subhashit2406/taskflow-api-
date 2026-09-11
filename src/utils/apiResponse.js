/**
 * TaskFlow API - Standardized API Response Helper
 * Enforces consistent REST JSON structure across all endpoints.
 */

class ApiResponse {
  /**
   * Send a successful 200 OK response.
   */
  static success(res, data = null, message = 'Success', statusCode = 200, meta = null) {
    const payload = {
      success: true,
      message,
      data,
    };
    if (meta) payload.meta = meta;
    return res.status(statusCode).json(payload);
  }

  /**
   * Send a 201 Created response.
   */
  static created(res, data, message = 'Resource created successfully', meta = null) {
    return ApiResponse.success(res, data, message, 201, meta);
  }

  /**
   * Send a 204 No Content response.
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Send a paginated list response with metadata.
   */
  static paginated(res, items, pagination, message = 'Resources retrieved successfully') {
    const { totalItems, page, limit } = pagination;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      success: true,
      message,
      data: items,
      meta: {
        pagination: {
          totalItems: parseInt(totalItems, 10),
          totalPages,
          currentPage: parseInt(page, 10),
          limit: parseInt(limit, 10),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  }

  /**
   * Send a standardized error response.
   */
  static error(res, message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    const payload = {
      success: false,
      error: {
        code,
        message,
      },
    };
    if (details) payload.error.details = details;
    return res.status(statusCode).json(payload);
  }
}

module.exports = ApiResponse;
