import '../styles/globals.css'
import { CartProvider } from '../context/CartContext'
import { AuthProvider } from '../context/AuthContext'
import { I18nProvider } from '../context/I18nContext'
import { FavoritesProvider } from '../context/FavoritesContext'
import { AddressProvider } from '../context/AddressContext'
import Toast from '../components/Toast'

export default function App({ Component, pageProps, shopInfo }) {
  return (
    <I18nProvider initialShopInfo={shopInfo}>
      <AuthProvider>
        <AddressProvider>
          <FavoritesProvider>
            <CartProvider>
              <Component {...pageProps} />
              <Toast />
            </CartProvider>
          </FavoritesProvider>
        </AddressProvider>
      </AuthProvider>
    </I18nProvider>
  )
}

App.getInitialProps = async () => {
  try {
    // 仅在服务端执行，避免 SSR useEffect 问题
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3457'
    const res = await fetch(`${baseUrl}/api/shop-info`)
    const shopInfo = await res.json()
    return { shopInfo }
  } catch {
    return { shopInfo: {} }
  }
}
