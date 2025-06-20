import React from 'react';
import { View, Text } from 'react-native';

interface TestWrapperProps {
  children: React.ReactNode;
  title?: string;
}

const TestWrapper: React.FC<TestWrapperProps> = ({ children, title = "Test" }) => {
  console.log('TestWrapper rendering with title:', title);
  
  return (
    <View style={{ backgroundColor: '#333', padding: 10, margin: 5 }}>
      <Text style={{ color: '#fff', fontSize: 12 }}>{title}</Text>
      {children}
    </View>
  );
};

export default TestWrapper;
