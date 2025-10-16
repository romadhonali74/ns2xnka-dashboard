import { useState, useEffect } from 'react';

export interface Vessel {
  id: number;
  vessel_name: string;
  vessel_code?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useVessels = () => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVessels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/vessels');
        if (!response.ok) {
          throw new Error('Failed to fetch vessels');
        }
        
        const data = await response.json();
        setVessels(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchVessels();
  }, []);

  const addVessel = async (vesselName: string, vesselCode?: string) => {
    try {
      const response = await fetch('/api/vessels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vessel_name: vesselName, vessel_code: vesselCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to add vessel');
      }

      const newVessel = await response.json();
      setVessels(prev => [...prev, newVessel]);
      return newVessel;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to add vessel');
    }
  };

  return { vessels, loading, error, addVessel };
};