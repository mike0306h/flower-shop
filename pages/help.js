'use client'

import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import { useI18n } from '../context/I18nContext'
import { getShopInfo } from '../services/api'

export default function Help() {
  const { t } = useI18n()
  const [shopInfo, setShopInfo] = useState(null)

  useEffect(() => {
    getShopInfo().then(setShopInfo).catch(console.error)
  }, [])

  const phone = shopInfo?.phone || '400-888-9527'
  const email = shopInfo?.email || ''

  const deliveryInfo = [
    {
      title: '配送范围',
      content: '我们提供曼谷市内的鲜花配送服务。具体配送范围包括：曼谷市区、暖武里府、巴吞他尼府等地区。请在下单时填写完整地址，我们会确认是否在配送范围内。'
    },
    {
      title: '配送时间',
      content: '标准配送时间为下单后 2-4 小时送达。当日订单截止时间为 17:00，17:00 之后的订单将于次日送达。如需指定时间段配送，请提前与我们联系。'
    },
    {
      title: '配送费用',
      content: '曼谷市区内配送费统一为 ฿50。偏远地区可能收取额外费用，具体以结算时显示为准。订单金额超过 ฿1,000 可享受免费配送。'
    },
    {
      title: '配送追踪',
      content: `下单后您会收到确认短信，配送员出发时会再次通知您。如需查询订单状态，请联系客服热线：${phone}`
    },
    {
      title: '特殊天气',
      content: '如遇暴雨、洪水等特殊天气情况，配送时间可能延迟。我们会第一时间通知您，并根据情况提供退款或重新安排配送服务。'
    }
  ]

  const refundInfo = [
    {
      title: '退换政策',
      content: '由于鲜花属于易损商品，我们在以下情况下提供退换服务：\n\n• 鲜花在配送过程中严重损坏\n• 实际配送商品与订单不符\n• 鲜花在收到后 24 小时内枯萎（非人为原因）'
    },
    {
      title: '退款流程',
      content: `如需退款，请在收到商品后 24 小时内联系客服，提供订单号和商品照片。我们会在 3-5 个工作日内完成退款处理。退款将原路返回您的支付账户。\n\n客服电话：${phone}`
    },
    {
      title: '不予退换情况',
      content: '以下情况不在退换范围内：\n\n• 收货人拒收\n• 因客户原因填写错误地址\n• 鲜花已摆放超过 24 小时\n• 定制类鲜花产品（根据客户要求特别制作）'
    },
    {
      title: '投诉建议',
      content: `如果您对我们的服务有任何建议或投诉，欢迎通过以下方式联系我们：\n\n• 电话：${phone}${email ? `\n• 邮箱：${email}` : ''}`
    }
  ]

  const faqInfo = [
    {
      q: '如何下单？',
      a: '您可以直接在我们的网站选购商品，加入购物车后结算。也可以通过电话或微信联系我们人工下单。'
    },
    {
      q: '支持哪些支付方式？',
      a: '我们支持支付宝、微信支付、信用卡、借记卡等多种支付方式。货到付款仅支持曼谷市内。'
    },
    {
      q: '可以提前预订吗？',
      a: '当然可以！我们支持最多提前 30 天预订。您可以在预约定制页面填写期望送达日期，我们会提前准备好鲜花。'
    },
    {
      q: '需要注册账号才能购买吗？',
      a: '不需要。您可以先浏览商品，将心仪的鲜花加入购物车。结账时才需要登录或注册账号。'
    },
    {
      q: '可以开发票吗？',
      a: '可以。请在结账时填写发票抬头信息，或联系客服告知。我们会在订单完成后 3 天内发送电子发票。'
    },
    {
      q: '企业客户有优惠吗？',
      a: '我们为企业和VIP客户提供专属折扣。每月消费满 ฿10,000 可升级为VIP会员，享受 9 折优惠。欢迎与我们联系洽谈合作。'
    },
    {
      q: '如何成为花店会员？',
      a: '注册账号后，每次消费都会累积积分。积分可兑换优惠券或礼品。消费满 ฿5,000 自动升级为银卡会员，消费满 ฿20,000 升级为金卡会员。'
    },
    {
      q: '鲜花如何保鲜？',
      a: '收到鲜花后，请及时插入清水中，放置在阴凉通风处。避免阳光直射和空调直吹。每 1-2 天换一次水，并斜剪花枝底部，可延长鲜花观赏期。'
    }
  ]

  return (
    <>
      <Head>
        <title>帮助中心 - {t('shop_name')}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            <Link href="#delivery" className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors">
              🚚 配送说明
            </Link>
            <Link href="#refund" className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors">
              💰 退换政策
            </Link>
            <Link href="#faq" className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-full font-medium hover:bg-gray-50 transition-colors">
              ❓ 常见问题
            </Link>
          </div>

          {/* Delivery Info */}
          <section id="delivery" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-3xl">🚚</span> 配送说明
            </h2>
            <div className="space-y-4">
              {deliveryInfo.map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
                  <h3 className="font-semibold text-pink-600 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.content}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Refund Info */}
          <section id="refund" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-3xl">💰</span> 退换政策
            </h2>
            <div className="space-y-4">
              {refundInfo.map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
                  <h3 className="font-semibold text-pink-600 mb-2">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.content}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="text-3xl">❓</span> 常见问题
            </h2>
            <div className="space-y-4">
              {faqInfo.map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-pink-100">
                  <h3 className="font-semibold text-pink-600 mb-3">Q: {item.q}</h3>
                  <p className="text-gray-600 leading-relaxed">A: {item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">还有其他问题？</h2>
            <p className="mb-6 opacity-90">我们的客服团队随时为您服务</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href={`tel:${phone}`} className="px-6 py-3 bg-white text-pink-600 rounded-full font-medium hover:bg-pink-50 transition-colors">
                📞 {phone}
              </a>
              <Link href="/#contact" className="px-6 py-3 bg-white/20 text-white rounded-full font-medium hover:bg-white/30 transition-colors">
                💬 在线留言
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-12">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <p className="text-gray-400">© 2026 {t('shop_name')} Floral Shop. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
