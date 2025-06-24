# ml-service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import pymongo
from datetime import datetime, timedelta
import os
from prophet import Prophet
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb+srv://vincentmutinda560:r50uaucb0eYmmb3N@cluster0.wk1rcof.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
client = pymongo.MongoClient(MONGO_URI)
db = client.rider_management

class ChurnPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        
    def prepare_data(self):
        """Fetch and prepare data for churn prediction"""
        try:
            # Fetch riders data
            riders_data = list(db.riders.find())
            swaps_data = list(db.swaphistories.find())
            payments_data = list(db.payments.find())
            
            if not riders_data:
                return None, None, None
                
            # Create DataFrame
            riders_df = pd.DataFrame(riders_data)
            
            # Calculate features for each rider
            features = []
            for rider in riders_data:
                rider_id = rider['riderId']
                
                # Swap frequency features
                rider_swaps = [s for s in swaps_data if s['riderId'] == rider_id]
                swap_count = len(rider_swaps)
                
                # Recent activity (last 30 days)
                recent_date = datetime.now() - timedelta(days=30)
                recent_swaps = [s for s in rider_swaps if s.get('swapDate', datetime.min) > recent_date]
                recent_swap_count = len(recent_swaps)
                
                # Payment behavior
                rider_payments = [p for p in payments_data if p['riderId'] == rider_id]
                total_payments = len(rider_payments)
                failed_payments = len([p for p in rider_payments if p['status'] == 'failed'])
                
                # Days since registration
                reg_date = rider.get('registrationDate', datetime.now())
                if isinstance(reg_date, str):
                    reg_date = datetime.fromisoformat(reg_date.replace('Z', '+00:00'))
                days_since_reg = (datetime.now() - reg_date).days
                
                # Calculate churn label (rider inactive for 30+ days)
                last_swap_date = max([s.get('swapDate', datetime.min) for s in rider_swaps], default=datetime.min)
                if isinstance(last_swap_date, str):
                    last_swap_date = datetime.fromisoformat(last_swap_date.replace('Z', '+00:00'))
                days_since_last_swap = (datetime.now() - last_swap_date).days
                is_churned = 1 if days_since_last_swap > 30 else 0
                
                features.append({
                    'riderId': rider_id,
                    'swap_count': swap_count,
                    'recent_swap_count': recent_swap_count,
                    'total_payments': total_payments,
                    'failed_payments': failed_payments,
                    'payment_failure_rate': failed_payments / max(total_payments, 1),
                    'days_since_registration': days_since_reg,
                    'days_since_last_swap': days_since_last_swap,
                    'avg_swaps_per_day': swap_count / max(days_since_reg, 1),
                    'region': rider.get('region', 'unknown'),
                    'is_churned': is_churned
                })
            
            features_df = pd.DataFrame(features)
            
            # Encode categorical variables
            if 'region' in features_df.columns:
                le_region = LabelEncoder()
                features_df['region_encoded'] = le_region.fit_transform(features_df['region'])
                self.label_encoders['region'] = le_region
            
            # Separate features and target
            feature_columns = [
                'swap_count', 'recent_swap_count', 'total_payments', 
                'failed_payments', 'payment_failure_rate', 'days_since_registration',
                'days_since_last_swap', 'avg_swaps_per_day', 'region_encoded'
            ]
            
            X = features_df[feature_columns].fillna(0)
            y = features_df['is_churned']
            
            return X, y, features_df
            
        except Exception as e:
            print(f"Error preparing data: {e}")
            return None, None, None
    
    def train_model(self):
        """Train the churn prediction model"""
        X, y, _ = self.prepare_data()
        
        if X is None:
            return False
            
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test_scaled)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Create models directory if it doesn't exist
        os.makedirs('models', exist_ok=True)
        
        # Save model
        joblib.dump(self.model, 'models/churn_model.pkl')
        joblib.dump(self.scaler, 'models/churn_scaler.pkl')
        
        print(f"Churn model trained with accuracy: {accuracy:.2f}")
        return True
    
    def predict_churn(self):
        """Predict churn for all riders"""
        try:
            # Load model if not in memory
            if self.model is None:
                try:
                    self.model = joblib.load('models/churn_model.pkl')
                    self.scaler = joblib.load('models/churn_scaler.pkl')
                except:
                    # Train model if not exists
                    if not self.train_model():
                        return []
            
            X, _, features_df = self.prepare_data()
            
            if X is None:
                return []
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Predict
            predictions = self.model.predict(X_scaled)
            probabilities = self.model.predict_proba(X_scaled)
            
            # Create results
            results = []
            for i, rider_id in enumerate(features_df['riderId']):
                risk_level = 'high' if predictions[i] == 1 else 'low'
                if predictions[i] == 0 and probabilities[i][1] > 0.3:
                    risk_level = 'medium'
                
                results.append({
                    'riderId': rider_id,
                    'risk': risk_level,
                    'probability': probabilities[i][1]
                })
            
            return results
            
        except Exception as e:
            print(f"Error predicting churn: {e}")
            return []

class SwapDemandForecaster:
    def __init__(self):
        self.model = None
    
    def prepare_forecast_data(self, location=None):
        """Prepare data for swap demand forecasting"""
        try:
            # Fetch swap history
            query = {'location.name': location} if location else {}
            swaps_data = list(db.swaphistories.find(query))
            
            if not swaps_data:
                return None
            
            # Create daily aggregations
            daily_swaps = {}
            for swap in swaps_data:
                swap_date = swap.get('swapDate', datetime.now())
                if isinstance(swap_date, str):
                    swap_date = datetime.fromisoformat(swap_date.replace('Z', '+00:00'))
                
                date_key = swap_date.strftime('%Y-%m-%d')
                daily_swaps[date_key] = daily_swaps.get(date_key, 0) + 1
            
            # Create DataFrame for Prophet
            df = pd.DataFrame([
                {'ds': pd.to_datetime(date), 'y': count}
                for date, count in daily_swaps.items()
            ]).sort_values('ds')
            
            return df
            
        except Exception as e:
            print(f"Error preparing forecast data: {e}")
            return None
    
    def forecast_demand(self, location=None, days=7):
        """Forecast swap demand"""
        try:
            df = self.prepare_forecast_data(location)
            
            if df is None or len(df) < 10:  # Need minimum data points
                return []
            
            # Create and fit Prophet model
            model = Prophet(daily_seasonality=True, weekly_seasonality=True)
            model.fit(df)
            
            # Create future dataframe
            future = model.make_future_dataframe(periods=days)
            forecast = model.predict(future)
            
            # Get only future predictions
            future_forecast = forecast.tail(days)
            
            results = []
            for _, row in future_forecast.iterrows():
                results.append({
                    'date': row['ds'].strftime('%Y-%m-%d'),
                    'predicted_swaps': max(0, int(row['yhat'])),
                    'lower_bound': max(0, int(row['yhat_lower'])),
                    'upper_bound': max(0, int(row['yhat_upper']))
                })
            
            return results
            
        except Exception as e:
            print(f"Error forecasting demand: {e}")
            return []

# Initialize predictors
churn_predictor = ChurnPredictor()
demand_forecaster = SwapDemandForecaster()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/train/churn', methods=['POST'])
def train_churn_model():
    """Train the churn prediction model"""
    try:
        success = churn_predictor.train_model()
        return jsonify({
            'success': success,
            'message': 'Churn model trained successfully' if success else 'Failed to train churn model'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict/churn', methods=['GET'])
def predict_churn():
    """Get churn predictions for all riders"""
    try:
        predictions = churn_predictor.predict_churn()
        return jsonify({
            'success': True,
            'predictions': predictions,
            'count': len(predictions)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/predict/churn/<rider_id>', methods=['GET'])
def predict_rider_churn(rider_id):
    """Get churn prediction for a specific rider"""
    try:
        predictions = churn_predictor.predict_churn()
        rider_prediction = next((p for p in predictions if p['riderId'] == rider_id), None)
        
        if rider_prediction:
            return jsonify({
                'success': True,
                'prediction': rider_prediction
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Rider not found or no prediction available'
            }), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/forecast/demand', methods=['GET'])
def forecast_demand():
    """Forecast swap demand"""
    try:
        location = request.args.get('location')
        days = int(request.args.get('days', 7))
        
        forecast = demand_forecaster.forecast_demand(location, days)
        return jsonify({
            'success': True,
            'forecast': forecast,
            'location': location or 'all',
            'days': days
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/analytics/summary', methods=['GET'])
def analytics_summary():
    """Get analytics summary"""
    try:
        # Get churn predictions
        churn_predictions = churn_predictor.predict_churn()
        
        # Calculate churn statistics
        high_risk_count = len([p for p in churn_predictions if p['risk'] == 'high'])
        medium_risk_count = len([p for p in churn_predictions if p['risk'] == 'medium'])
        low_risk_count = len([p for p in churn_predictions if p['risk'] == 'low'])
        
        # Get recent swap data
        recent_date = datetime.now() - timedelta(days=30)
        recent_swaps = list(db.swaphistories.find({
            'swapDate': {'$gte': recent_date}
        }))
        
        # Calculate daily average
        daily_avg = len(recent_swaps) / 30 if recent_swaps else 0
        
        # Get total riders
        total_riders = db.riders.count_documents({})
        
        # Get payment statistics
        total_payments = db.payments.count_documents({})
        failed_payments = db.payments.count_documents({'status': 'failed'})
        
        return jsonify({
            'success': True,
            'summary': {
                'total_riders': total_riders,
                'churn_risk': {
                    'high': high_risk_count,
                    'medium': medium_risk_count,
                    'low': low_risk_count
                },
                'recent_activity': {
                    'total_swaps_30_days': len(recent_swaps),
                    'daily_average': round(daily_avg, 2)
                },
                'payment_stats': {
                    'total_payments': total_payments,
                    'failed_payments': failed_payments,
                    'success_rate': round((total_payments - failed_payments) / max(total_payments, 1) * 100, 2)
                }
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/analytics/trends', methods=['GET'])
def analytics_trends():
    """Get trend analysis"""
    try:
        days = int(request.args.get('days', 30))
        start_date = datetime.now() - timedelta(days=days)
        
        # Get daily swap counts
        pipeline = [
            {'$match': {'swapDate': {'$gte': start_date}}},
            {
                '$group': {
                    '_id': {
                        '$dateToString': {
                            'format': '%Y-%m-%d',
                            'date': '$swapDate'
                        }
                    },
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id': 1}}
        ]
        
        daily_swaps = list(db.swaphistories.aggregate(pipeline))
        
        # Get payment trends
        payment_pipeline = [
            {'$match': {'createdAt': {'$gte': start_date}}},
            {
                '$group': {
                    '_id': {
                        'date': {
                            '$dateToString': {
                                'format': '%Y-%m-%d',
                                'date': '$createdAt'
                            }
                        },
                        'status': '$status'
                    },
                    'count': {'$sum': 1}
                }
            },
            {'$sort': {'_id.date': 1}}
        ]
        
        payment_trends = list(db.payments.aggregate(payment_pipeline))
        
        return jsonify({
            'success': True,
            'trends': {
                'daily_swaps': daily_swaps,
                'payment_trends': payment_trends
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/recommendations/retention', methods=['GET'])
def retention_recommendations():
    """Get retention recommendations based on churn predictions"""
    try:
        predictions = churn_predictor.predict_churn()
        high_risk_riders = [p for p in predictions if p['risk'] == 'high']
        
        recommendations = []
        for rider in high_risk_riders[:10]:  # Top 10 high-risk riders
            # Get rider details
            rider_data = db.riders.find_one({'riderId': rider['riderId']})
            if rider_data:
                recommendations.append({
                    'riderId': rider['riderId'],
                    'riderName': rider_data.get('name', 'Unknown'),
                    'risk_probability': rider['probability'],
                    'recommended_actions': [
                        'Send personalized discount offer',
                        'Provide priority customer support',
                        'Offer loyalty program enrollment',
                        'Follow up with satisfaction survey'
                    ]
                })
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    
    # Start the application
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5001)), debug=True)