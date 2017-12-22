import net = require('net');
import ip = require('ip-address');

export function getIpV4Address(address: string): string {
  if (net.isIPv4(address)) {
    return address;
  }
  if (net.isIPv6(address)) {
    return new ip.Address6(address).to4().address;
  }
  return '';
}
