'use strict';

const { z } = require('zod');

const RATING_WORDS = ['One', 'Two', 'Three', 'Four', 'Five'];

const BookRecord = z.object({
  title: z.string().min(1),
  product_url: z.string().url(),
  price_text: z.string().min(1),
  price_gbp: z.number().positive(),
  availability_text: z.string().min(1),
  rating_text: z.enum(RATING_WORDS).nullable(),
  description: z.string().nullable(),
  source_page: z.string().url(),
  fetched_at: z.string().datetime(),
});

module.exports = { BookRecord };
