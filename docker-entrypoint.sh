#!/bin/sh
set -e

echo "Starting Billing & Payment Service..."

echo "Starting application..."
exec "$@"
