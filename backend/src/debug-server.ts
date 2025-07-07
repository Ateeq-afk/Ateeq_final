// Testing server startup step by step
console.log('1. Starting server...');

try {
  console.log('2. Importing express...');
  import('express').then(({ default: express }) => {
    console.log('3. Express imported successfully');
    
    console.log('4. Importing cors...');
    import('cors').then(({ default: cors }) => {
      console.log('5. CORS imported successfully');
      
      console.log('6. Importing dotenv...');
      import('dotenv/config').then(() => {
        console.log('7. Dotenv imported successfully');
        
        console.log('8. Importing logger...');
        import('./utils/logger').then(({ log }) => {
          console.log('9. Logger imported successfully');
          
          console.log('10. Importing Sentry...');
          import('./config/sentry').then((SentryManager) => {
            console.log('11. Sentry imported successfully');
            
            console.log('12. Initializing Sentry...');
            SentryManager.default.initialize();
            console.log('13. Sentry initialized successfully');
            
            const app = express();
            
            app.use(cors({
              origin: ['http://localhost:5173', 'http://localhost:3000'],
              credentials: true
            }));
            
            app.use(express.json());
            
            app.get('/health', (req, res) => {
              res.json({ status: 'ok', timestamp: new Date().toISOString() });
            });
            
            const port = process.env.PORT || 4000;
            
            app.listen(port, () => {
              console.log(`Debug server running on http://localhost:${port}`);
            });
            
          }).catch(err => {
            console.error('Error importing Sentry:', err);
          });
          
        }).catch(err => {
          console.error('Error importing logger:', err);
        });
        
      }).catch(err => {
        console.error('Error importing dotenv:', err);
      });
      
    }).catch(err => {
      console.error('Error importing cors:', err);
    });
    
  }).catch(err => {
    console.error('Error importing express:', err);
  });
  
} catch (err) {
  console.error('Error in startup:', err);
}