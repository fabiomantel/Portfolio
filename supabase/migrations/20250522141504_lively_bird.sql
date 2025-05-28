/*
  # Portfolio Tracker Schema

  1. New Tables
    - `assets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `ticker` (text)
      - `exchange` (text)
      - `trading_currency` (text)
      - `broker` (text)
      - `current_price` (numeric)
      - `previous_price` (numeric)
      - `last_updated` (timestamptz)
      - `current_price_overwritten` (boolean)
      - `created_at` (timestamptz)

    - `purchases`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, references assets)
      - `price` (numeric)
      - `quantity` (numeric)
      - `date` (date)
      - `currency` (text)
      - `created_at` (timestamptz)

    - `rsus`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `ticker` (text)
      - `company_name` (text)
      - `grant_date` (date)
      - `total_granted` (numeric)
      - `created_at` (timestamptz)

    - `vesting_entries`
      - `id` (uuid, primary key)
      - `rsu_id` (uuid, references rsus)
      - `date` (date)
      - `quantity` (numeric)
      - `is_vested` (boolean)
      - `created_at` (timestamptz)

    - `espps`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `ticker` (text)
      - `company_name` (text)
      - `grant_date` (date)
      - `purchase_price` (numeric)
      - `market_price` (numeric)
      - `quantity` (numeric)
      - `discount` (numeric)
      - `broker` (text)
      - `cycle_start_date` (date)
      - `cycle_end_date` (date)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create assets table
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  ticker text NOT NULL,
  exchange text NOT NULL,
  trading_currency text NOT NULL,
  broker text NOT NULL,
  current_price numeric DEFAULT 0,
  previous_price numeric DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  current_price_overwritten boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_exchange CHECK (exchange IN ('NYSE', 'NASDAQ', 'TASE', 'LSE', 'EURONEXT')),
  CONSTRAINT valid_currency CHECK (trading_currency IN ('USD', 'ILS', 'EUR', 'GBP'))
);

-- Create purchases table
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets ON DELETE CASCADE NOT NULL,
  price numeric NOT NULL CHECK (price > 0),
  quantity numeric NOT NULL CHECK (quantity > 0),
  date date NOT NULL,
  currency text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_currency CHECK (currency IN ('USD', 'ILS', 'EUR', 'GBP'))
);

-- Create RSUs table
CREATE TABLE rsus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  ticker text NOT NULL,
  company_name text NOT NULL,
  grant_date date NOT NULL,
  total_granted numeric NOT NULL CHECK (total_granted > 0),
  created_at timestamptz DEFAULT now()
);

-- Create vesting entries table
CREATE TABLE vesting_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rsu_id uuid REFERENCES rsus ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  is_vested boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create ESPPs table
CREATE TABLE espps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  ticker text NOT NULL,
  company_name text NOT NULL,
  grant_date date NOT NULL,
  purchase_price numeric NOT NULL CHECK (purchase_price > 0),
  market_price numeric NOT NULL CHECK (market_price > 0),
  quantity numeric NOT NULL CHECK (quantity > 0),
  discount numeric NOT NULL CHECK (discount >= 0 AND discount <= 100),
  broker text NOT NULL,
  cycle_start_date date NOT NULL,
  cycle_end_date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_cycle_dates CHECK (cycle_end_date > cycle_start_date)
);

-- Enable Row Level Security
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsus ENABLE ROW LEVEL SECURITY;
ALTER TABLE vesting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE espps ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own assets"
  ON assets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage purchases through assets"
  ON purchases
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM assets 
    WHERE assets.id = purchases.asset_id 
    AND assets.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM assets 
    WHERE assets.id = purchases.asset_id 
    AND assets.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own RSUs"
  ON rsus
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage vesting entries through RSUs"
  ON vesting_entries
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM rsus 
    WHERE rsus.id = vesting_entries.rsu_id 
    AND rsus.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM rsus 
    WHERE rsus.id = vesting_entries.rsu_id 
    AND rsus.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own ESPPs"
  ON espps
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);