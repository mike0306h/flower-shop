// 图片URL处理工具
// 相对路径 /static/ 拼接后端地址

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3457'

export function getImageUrl(imagePath) {
  if (!imagePath) return null
  // 已经是完整URL（http/https开头），直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // 相对路径 /static/ 直接拼接后端地址
  if (imagePath.startsWith('/static/')) {
    return BACKEND_URL + imagePath
  }
  // 其他相对路径也拼接
  return BACKEND_URL + '/' + imagePath
}
