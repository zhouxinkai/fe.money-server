import { route } from './decorator';

export default class AliveController {
  @route('get', '/api/monitor/alive')
  alive() {
    return {data: true}
  }
}
