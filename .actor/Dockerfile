# Use official Apify Node.js image
FROM apify/actor-node:20

# Copy all files to the Actor directory
COPY . ./

# Install dependencies
RUN npm install --production

# Start the Actor
CMD npm start
