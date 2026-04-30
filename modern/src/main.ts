import { createApp } from 'vue';
import App from './App.vue';
import { loadRuntimeData } from './data/runtime';
import './styles/app.css';

loadRuntimeData().finally(() => {
  createApp(App).mount('#app');
});
