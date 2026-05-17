-- Seed promotions matching the currently hardcoded affiliate links
INSERT INTO public.promotions (type, title, description, link_url, call_to_action, is_active, display_locations, priority)
VALUES
  (
    'affiliate',
    'Penn Championship Balls',
    'The #1 choice for league play. Stock up on a case of 24 cans before your first match.',
    'https://amzn.to/3Pcg58x',
    'Shop on Amazon',
    true,
    ARRAY['landing'],
    1
  ),
  (
    'affiliate',
    'Wilson Tennis Balls',
    'Tour-level feel and durability. Grab a case for the season ahead.',
    'https://amzn.to/49tdk9E',
    'Shop on Amazon',
    true,
    ARRAY['landing'],
    2
  ),
  (
    'affiliate',
    'Get A Grip Overgrip',
    'Tacky feel that lasts. Stock up before your next match.',
    'https://amzn.to/3P3wkoq',
    'Shop Now',
    true,
    ARRAY['dashboard'],
    1
  ),
  (
    'affiliate',
    'Restring Before Your Match',
    'Coordinate your restringing before the match. Fresh strings = better play.',
    '#',
    'Learn More',
    true,
    ARRAY['match_hub'],
    1
  ),
  (
    'placeholder',
    'Sponsor a Flex',
    'Reach hundreds of active tennis players in your city. Partner with us today.',
    '/register?type=request',
    'Get in Touch',
    true,
    ARRAY['landing'],
    99
  ),
  (
    'placeholder',
    'Your Brand Here',
    'Reach every player in this division with your message.',
    '/register?type=request',
    'Partner With Us',
    true,
    ARRAY['dashboard'],
    99
  )
ON CONFLICT (id) DO NOTHING;
