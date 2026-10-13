import Home from './Home';

export const route = {
  path: '/returns',
  layout: 'public',
  access: 'public',
};

export default function Returns() {
  return <Home />;
}
