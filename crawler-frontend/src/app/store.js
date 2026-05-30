import { configureStore } from '@reduxjs/toolkit';

import crawlerReducer from '../redux/crawlerSlice';

export const store = configureStore({

  reducer: {
    crawler: crawlerReducer,
  },
});