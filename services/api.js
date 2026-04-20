/**
 * 前台用户 API 服务
 */
import axios from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3457'

// 创建 axios 实例
const createApi = () => {
  const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // 请求拦截器 - 添加语言和 Token
  api.interceptors.request.use((config) => {
    const lang = typeof window !== 'undefined' ? localStorage.getItem('flower_lang') || 'zh' : 'zh'
    config.headers['Accept-Language'] = lang

    // 添加用户 Token
    const token = typeof window !== 'undefined' ? localStorage.getItem('flower_user_token') : null
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  })

  // 响应拦截器
  api.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response?.status === 401) {
        // Token 过期，移除登录状态
        if (typeof window !== 'undefined') {
          localStorage.removeItem('flower_user_token')
          localStorage.removeItem('flower_user')
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return api
}

const api = createApi()

// ============ 用户认证 API ============

// 注册
export const register = (data) => api.post('/api/user/register', data)

// 登录
export const login = (data) => api.post('/api/user/login', data)

// 获取当前用户信息
export const getCurrentUser = () => api.get('/api/user/me')

// 更新用户信息
export const updateUser = (data) => api.put('/api/user/me', data)

// 绑定 Line Token
export const bindLineToken = (line_token) => api.post('/api/user/line-token', null, {
  params: { line_token }
})

// 获取积分和等级
export const getPoints = () => api.get('/api/user/points')

// 修改密码
export const changePassword = (old_password, new_password) =>
  api.post('/api/user/change-password', { old_password, new_password })

// 获取用户订单历史
export const getUserOrders = (page = 1, page_size = 10) =>
  api.get('/api/user/orders', { params: { page, page_size } })

// ============ 公开 API（无需认证）============

// 提交联系表单
export const submitContact = (data) => api.post('/api/contacts/public', data)

// 获取翻译
export const getTranslations = (lang) => api.get(`/api/i18n?lang=${lang}`)

// ============ 优惠券 API（公开）============

// 获取可用优惠券列表
export const getCoupons = (page = 1, page_size = 50) =>
  api.get('/api/coupons', { params: { page, page_size } })

// 验证单个优惠券码
export const validateCoupon = (code) =>
  api.post('/api/coupons/validate', { code })

// ============ 商品 API（公开）============

// 获取商品列表（公开，不需认证）
export const getProducts = (params) => api.get('/api/products', { params })

// 获取单个商品详情（公开，不需认证）
export const getProduct = (id) => api.get(`/api/products/${id}`)

// 获取分类列表（公开，不需认证）
export const getCategories = () => api.get('/api/categories', { params: { active_only: true } })

// ============ 订单 API ============

// 创建订单（带 Token）
export const createOrder = (data) => api.post('/api/orders', data, {
  headers: {
    'Content-Type': 'application/json',
  }
})

// 更新订单（如确认收货）
export const updateOrder = (orderId, data) => api.patch(`/api/orders/${orderId}`, data)

// 获取单个订单详情
export const getOrder = (orderId) => api.get(`/api/orders/${orderId}`)

// ============ 评价 API ============

// 获取商品评价列表
export const getProductReviews = (productId, page = 1, pageSize = 10) =>
  api.get(`/reviews/product/${productId}`, { params: { page, page_size: pageSize } })

// 提交商品评价
export const createReview = (data) => api.post('/reviews', data)

// 取消订单申请
export const cancelOrder = (orderId, reason) =>
  api.post('/user/cancel-order', { order_id: orderId, reason })

// ============ 预约 API（公开，无需认证）============

// 创建预约
export const createAppointment = (data) => api.post('/api/appointments/public', data)

// ============ 店铺信息 API（公开）============

// 获取店铺信息
export const getShopInfo = () => api.get('/api/shop-info')

// ============ 文件上传 API ============

// 上传单张图片
export const uploadImage = async (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post(
    `${API_BASE}/api/upload/image`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    }
  )
  return response.data
}

// 批量上传图片
export const uploadImages = async (files, onProgress) => {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const response = await axios.post(
    `${API_BASE}/api/upload/images`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percent)
        }
      },
    }
  )
  return response.data
}

// 获取上传后的完整图片URL
export const getImageUrl = (relativePath) => {
  return `${API_BASE}${relativePath}`
}

export default api

// ============ 邮箱验证 API ============

// 发送注册验证邮件
export const sendVerifyEmail = (email) => api.post('/api/email/send-verify-email', { email })

// 验证邮箱验证码
export const verifyEmailCode = (code) => api.post('/api/email/verify-email', { code })

// 发送重置密码邮件
export const sendResetPasswordEmail = (email) => api.post('/api/email/send-reset-password-email', { email })

// 重置密码
export const resetPassword = (code, new_password) => api.post('/api/email/reset-password', { code, new_password })

// ============ 补充 Orders.jsx 需要的 API（临时兼容）============

// 获取订单列表（后台管理）
export const getOrders = (params) => api.get('/api/orders', { params })

// 删除订单（后台管理）
export const deleteOrder = (orderId) => api.delete(`/api/orders/${orderId}`)
