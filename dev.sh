#!/bin/bash

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking Node.js version...${NC}"

# Try to load nvm if not available
if ! command -v nvm &> /dev/null; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Check if nvm is available
if command -v nvm &> /dev/null; then
    # Use version from .nvmrc
    nvm use
else
    echo -e "${YELLOW}nvm not found. Using current system node.${NC}"
fi

# Check current version
CURRENT_NODE=$(node -v)
REQUIRED_NODE=$(cat .nvmrc)

if [[ "$CURRENT_NODE" == v"$REQUIRED_NODE"* ]]; then
    echo -e "${GREEN}Using Node.js $CURRENT_NODE${NC}"
else
    echo -e "${YELLOW}Warning: Current Node.js is $CURRENT_NODE, but project requires v$REQUIRED_NODE${NC}"
fi

echo -e "${GREEN}Starting development server...${NC}"
npm run dev
