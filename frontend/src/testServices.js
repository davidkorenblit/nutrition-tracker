import authService from './services/authService';
import mealService from './services/mealService';

// בדיקה פשוטה
async function testServices() {
  try {
    console.log('🧪 Testing Services...\n');

    // בדיקה 1: רישום משתמש
    console.log('1️⃣ Testing Register...');
    const newUser = {
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User',
    };
    
    const registerResult = await authService.register(newUser);
    console.log('✅ Register successful:', registerResult);

    // בדיקה 2: התחברות
    console.log('\n2️⃣ Testing Login...');
    const loginResult = await authService.login({
      email: 'test@example.com',
      password: 'test123',
    });
    console.log('✅ Login successful, token saved!');

    // בדיקה 3: קבלת ארוחות של היום
    console.log('\n3️⃣ Testing Get Meals...');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const meals = await mealService.getMeals(today);
    console.log('✅ Meals retrieved:', meals);

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// הרץ את הבדיקה
testServices();