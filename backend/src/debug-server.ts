// Testing server startup step by step

try {
  import('express').then(({ default: express }) => {
    
    import('cors').then(({ default: cors }) => {
      
      import('dotenv/config').then(() => {
        
        import('./utils/logger').then(({ log }) => {
          
          import('./config/sentry').then((SentryManager) => {
            
            SentryManager.default.initialize();
            
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