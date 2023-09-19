export default function sleep(time = 1000) {
  return new Promise((res) => setTimeout(res, time))
}
