import MainPage from './components/MainPage';
import { WalletContextProvider, TokenRegistryContextProvider } from './contexts';

function App() {
  return (
    <WalletContextProvider>
      <TokenRegistryContextProvider>
        <MainPage />
      </TokenRegistryContextProvider>
    </WalletContextProvider>
  );
}

export default App;
