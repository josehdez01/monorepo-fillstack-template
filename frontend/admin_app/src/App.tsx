import logo from './logo.svg';
import './App.css';
import HelloMessage from '@/components/hello-message';
import { Button } from '@template/ui/shadcn/button';

export default function App() {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo" />
                <p>Monorepo Template - Admin App</p>
                <HelloMessage />
                <Button style={{ marginTop: '1rem' }}>Admin Button</Button>
                <a
                    className="App-link"
                    href="https://tanstack.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn TanStack
                </a>
            </header>
        </div>
    );
}
