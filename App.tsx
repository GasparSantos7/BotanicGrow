import { registerRootComponent } from 'expo';
import React from 'react';
import Navigation from './src/Navigation';


const App = () => {
  return <Navigation />;
};


registerRootComponent(App);
