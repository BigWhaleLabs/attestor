import { Controller, Get } from 'amala'

@Controller('/health')
export default class HealthController {
  @Get('/')
  health() {
    return 'ok'
  }
}
