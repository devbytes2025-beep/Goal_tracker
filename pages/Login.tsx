import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { backend } from '../services/mockBackend';
import { Button, Input, Card, Select, Modal } from '../components/UI';
import { useNavigate } from 'react-router-dom';
import { playSound, SECURITY_QUESTIONS } from '../constants';
import { Check, X, Mail, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { loginUser, showToast } = useApp();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [securityMethod, setSecurityMethod] = useState<'key' | 'question'>('question');
  
  // Forgot Password State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  
  // Verification Modal
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    securityQuestion: SECURITY_QUESTIONS[0],
    secretKeyAnswer: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Password Strength State
  const [pwdStrength, setPwdStrength] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
        calculateStrength(value);
    }
  };

  const calculateStrength = (pwd: string) => {
      let score = 0;
      if (pwd.length > 8) score++;
      if (/[A-Z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++; // Special char
      setPwdStrength(score);
  };

  const validateUsername = (username: string) => {
      // Alphanumeric + underscore, 3-20 chars
      const regex = /^[a-zA-Z0-9_]{3,20}$/;
      return regex.test(username);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    playSound('click');
    
    try {
      let user;
      if (isSignup) {
        // --- Validation ---
        if (!validateUsername(formData.username)) {
            throw new Error("Username must be 3-20 characters, letters, numbers, or underscores only.");
        }
        if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match");
        
        // Strict Password Check
        if (pwdStrength < 4) {
             throw new Error("Password is too weak. Must contain Uppercase, Number, Special Character and be 8+ chars.");
        }

        if (!formData.secretKeyAnswer) throw new Error("Security answer required");
        
        user = await backend.register({
            username: formData.username,
            email: formData.email,
            secretKeyAnswer: formData.secretKeyAnswer,
            securityQuestion: securityMethod === 'question' ? formData.securityQuestion : undefined
        }, formData.password);
        
        // Show Verification Modal instead of auto-navigating
        setIsVerificationSent(true);
        setIsLoading(false);
        playSound('success');
        return; // Stop here

      } else {
        user = await backend.login(formData.username, formData.password);
        loginUser(user);
        playSound('success');
        navigate('/'); 
      }
      
    } catch (err: any) {
      playSound('error');
      showToast(err.message || 'Authentication failed', 'error');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!forgotInput) {
          showToast("Please enter username or email", 'error');
          return;
      }
      try {
          // 1. Recover Account Details (Resolve Username/Email)
          const { email, username } = await backend.recoverAccount(forgotInput);
          
          // 2. Trigger Firebase Password Reset
          await backend.resetPassword(email);
          
          let msg = `Reset link sent to ${email}`;
          if (username) {
             // 3. Show Username in success message to help user remember
             msg = `Found Username: ${username}. Reset link sent to ${email}`;
          }
          
          showToast(msg, 'success');
          setIsForgotOpen(false);
          setForgotInput('');
      } catch (err: any) {
          showToast(err.message || "Failed to reset password", 'error');
      }
  };

  // Render Strength Bar
  const renderStrengthBar = () => {
      const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
      const width = (pwdStrength / 4) * 100;
      const color = colors[pwdStrength - 1] || 'bg-gray-600';
      
      return (
          <div className="mt-1">
              <div className="h-1 w-full bg-gray-700 rounded overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${color}`} style={{ width: `${width}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                   <span>Weak</span>
                   <span>Strong</span>
              </div>
              <ul className="text-[10px] text-gray-400 mt-1 space-y-0.5">
                  <li className={formData.password.length >= 8 ? "text-green-400" : ""}>• 8+ Characters</li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-green-400" : ""}>• 1 Uppercase</li>
                  <li className={/[0-9]/.test(formData.password) ? "text-green-400" : ""}>• 1 Number</li>
                  <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-400" : ""}>• 1 Special Char</li>
              </ul>
          </div>
      );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Verification Success Modal */}
      <Modal isOpen={isVerificationSent} onClose={() => { setIsVerificationSent(false); setIsSignup(false); }} title="Verify Your Email">
          <div className="text-center py-6">
             <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                 <Mail size={32} />
             </div>
             <h3 className="text-xl font-bold mb-2">Check your inbox!</h3>
             <p className="text-gray-300 mb-6">
                 We've sent a verification link to <b>{formData.email}</b>.<br/>
                 Please verify your email before logging in.
             </p>
             <Button onClick={() => { setIsVerificationSent(false); setIsSignup(false); }} className="w-full">
                 Back to Login
             </Button>
          </div>
      </Modal>

      <Card className="w-full max-w-md animate-[float_6s_ease-in-out_infinite]">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 mb-2">
                GlassHabit
            </h1>
            <p className="text-gray-400">Master your life with AI & Aesthetics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            name="username" 
            placeholder={isSignup ? "Create Username (Unique)" : "Username or Email"} 
            value={formData.username} 
            onChange={handleChange} 
            required 
          />
          
          {isSignup && (
            <Input 
              name="email" 
              type="email" 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          )}

          <div>
            <Input 
                name="password" 
                type="password" 
                placeholder="Password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
            />
            {isSignup && renderStrengthBar()}
          </div>

          {isSignup && (
            <>
                <Input 
                    name="confirmPassword" 
                    type="password" 
                    placeholder="Confirm Password" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    required 
                />
                
                <div className="pt-2">
                    <label className="text-sm text-gray-400 mb-1 block">Security Question (For Recovery)</label>
                    <Select 
                        name="securityQuestion"
                        value={formData.securityQuestion}
                        onChange={handleChange}
                        className="mb-2"
                    >
                        {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                    </Select>
                    
                    <Input 
                        name="secretKeyAnswer" 
                        placeholder="Your Answer" 
                        value={formData.secretKeyAnswer} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
            </>
          )}

          <Button type="submit" className="w-full justify-center mt-6" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isSignup ? 'Create Account' : 'Login')}
          </Button>

          <div className="flex justify-between items-center text-sm text-gray-400 mt-4">
             <button type="button" onClick={() => { setIsSignup(!isSignup); setFormData({...formData, password: ''}); setPwdStrength(0); }} className="hover:text-white transition-colors">
                 {isSignup ? 'Already have an account? Login' : 'Create an account'}
             </button>
             {!isSignup && (
                 <button 
                    type="button" 
                    onClick={() => setIsForgotOpen(true)}
                    className="hover:text-white transition-colors"
                 >
                     Forgot Password?
                 </button>
             )}
          </div>
        </form>
      </Card>

      {/* Forgot Password Modal */}
      <Modal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} title="Recover Account">
          <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="flex items-start gap-3 bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/20 mb-4">
                  <AlertCircle className="shrink-0 text-indigo-400" size={20} />
                  <p className="text-xs text-indigo-200">
                      Enter your <b>Username</b> or <b>Email</b>. We will send a password reset link to your registered email address.
                  </p>
              </div>
              
              <Input 
                  type="text" 
                  placeholder="Enter Username or Email" 
                  value={forgotInput} 
                  onChange={e => setForgotInput(e.target.value)} 
                  required
              />
              <Button type="submit" className="w-full">Find Account & Send Link</Button>
          </form>
      </Modal>
    </div>
  );
};

export default Login;