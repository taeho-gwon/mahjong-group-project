export class ApiError extends Error {
  readonly status: number
  readonly detail?: string

  constructor(status: number, message: string, detail?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }

  get isForbidden() {
    return this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }

  get isConflict() {
    return this.status === 409
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  400: '잘못된 요청입니다',
  403: '접근 권한이 없습니다',
  404: '요청한 리소스를 찾을 수 없습니다',
  409: '이미 존재하는 항목입니다',
  422: '입력 값이 올바르지 않습니다',
  500: '서버 오류가 발생했습니다',
}

export async function throwApiError(res: Response, fallbackMessage?: string): Promise<never> {
  let detail: string | undefined
  try {
    const body = await res.json()
    if (body?.detail) {
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    }
  } catch {
    // ignore parse errors
  }

  const message = detail ?? STATUS_MESSAGES[res.status] ?? fallbackMessage ?? `요청에 실패했습니다 (${res.status})`
  throw new ApiError(res.status, message, detail)
}
