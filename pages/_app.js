import '../styles/globals.css'
import { CartProvider } from '../context/CartContext'
import { AuthProvider } from '../context/AuthContext'
import { I18nProvider } from '../context/I18nContext'
import { FavoritesProvider } from '../context/FavoritesContext'
import { AddressProvider } from '../context/AddressContext'
import Toast from '../components/Toast'

export default function App({ Component, pageProps }) {
  return (
    <I18nProvider>
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
