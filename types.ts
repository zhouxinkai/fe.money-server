export enum OrderMode {
  SEQ_PAY_FORWARD = 2,
  TABLE_PAY_FORWARD = 3,
  TABLE_PAY_AFTERWARD = 4,
  TABLE_CHECK_OUT = 5,
  /**
   * pos桌台订单可以加菜
  */
  // TABLE_POS_PAY_FORWARD = 6,
  // TABLE_POS_PAY_AFTERWARD = 7,
}

export enum OrderSource {
  C = 1,
  POS = 2,
}
