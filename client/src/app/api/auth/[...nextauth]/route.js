import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';

const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          const { data } = await axios.post(`${backendUrl}/auth/login`, {
            email: credentials.email,
            password: credentials.password,
          });

          if (data && data.token) {
            return {
              ...data,
              id: data._id,
            };
          }
          return null;
        } catch (error) {
          const message = error.response?.data?.message || 'Invalid credentials';
          throw new Error(message);
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user._id || user.id;
        token.role = user.role;
        token.token = user.token;
        token.sellerApproved = user.sellerApproved;
      }
      
      if (account && account.provider === 'google') {
        try {
          const { data } = await axios.post(`${backendUrl}/auth/google-login`, {
            name: token.name,
            email: token.email,
            googleId: account.providerAccountId,
          });
          
          token.id = data._id;
          token.role = data.role;
          token.token = data.token;
          token.sellerApproved = data.sellerApproved;
        } catch (error) {
          // Sync error handling
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (!session.user) session.user = {};
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.token = token.token;
        session.user.sellerApproved = token.sellerApproved;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
