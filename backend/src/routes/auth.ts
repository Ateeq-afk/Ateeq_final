import { Router } from 'express';
import { supabase } from '../supabaseClient';
import { z } from 'zod';

const router = Router();

const schema = z.object({ token: z.string() });

router.post('/signin', async (req, res) => {
  const parse = schema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error);
  const { token } = parse.data;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  res.json({ user: data.user });
});

export default router;
